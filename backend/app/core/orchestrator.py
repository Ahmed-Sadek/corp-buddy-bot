import asyncio
import json
import logging
import os
import time
import uuid
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    Lightweight orchestrator client to trigger external workflows (e.g., Airflow) after events.

    Configuration via environment variables:
      AIRFLOW_BASE_URL: Base URL to Airflow (e.g., http://localhost:8080)
      AIRFLOW_DAG_ID: DAG ID to trigger on document ingestion
      AIRFLOW_USERNAME / AIRFLOW_PASSWORD: Basic auth credentials (if required)
      AIRFLOW_API_TOKEN: Bearer token (alternative to basic auth)
      AIRFLOW_VERIFY_SSL: 'true' | 'false' (default true)
      AIRFLOW_ENABLED: 'true' | 'false' (default true when BASE_URL and DAG_ID set)
    """

    def __init__(self) -> None:
        self.base_url: Optional[str] = os.getenv("AIRFLOW_BASE_URL")
        self.dag_id: Optional[str] = os.getenv("AIRFLOW_DAG_ID")
        self.username: Optional[str] = os.getenv("AIRFLOW_USERNAME")
        self.password: Optional[str] = os.getenv("AIRFLOW_PASSWORD")
        self.token: Optional[str] = os.getenv("AIRFLOW_API_TOKEN")
        self.verify_ssl: bool = os.getenv("AIRFLOW_VERIFY_SSL", "true").lower() == "true"

        # Enable only when base URL and dag id are provided
        self.enabled: bool = (
            os.getenv("AIRFLOW_ENABLED", "").lower() == "true"
            or (self.base_url and self.dag_id)
        )

        if not self.enabled:
            logger.info("Orchestrator disabled (missing AIRFLOW_BASE_URL/AIRFLOW_DAG_ID or AIRFLOW_ENABLED)")
        else:
            logger.info("Orchestrator enabled: Airflow integration will be used for document events")

    async def _trigger_airflow_dag(self, dag_id: str, conf: Dict[str, Any]) -> None:
        if not self.base_url:
            logger.warning("Airflow base URL not configured; skipping DAG trigger")
            return

        url = f"{self.base_url.rstrip('/')}/api/v1/dags/{dag_id}/dagRuns"
        dag_run_id = f"doc_ingested_{int(time.time())}_{uuid.uuid4().hex[:8]}"

        headers: Dict[str, str] = {"Content-Type": "application/json"}
        auth = None
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        elif self.username and self.password:
            auth = (self.username, self.password)

        payload = {"conf": conf, "dag_run_id": dag_run_id}

        try:
            async with httpx.AsyncClient(timeout=10.0, verify=self.verify_ssl, auth=auth, headers=headers) as client:
                resp = await client.post(url, data=json.dumps(payload))
                if resp.status_code >= 300:
                    logger.warning(
                        "Airflow DAG trigger failed (%s): %s", resp.status_code, resp.text[:200]
                    )
                else:
                    logger.info("Airflow DAG triggered: %s (%s)", dag_id, dag_run_id)
        except Exception as exc:
            logger.warning("Airflow trigger error: %s", str(exc))

    def trigger_document_ingested(self, *, filename: str, chunks_created: int, file_size: int, original_name: Optional[str] = None) -> None:
        """
        Fire-and-forget trigger to Airflow DAG for post-processing a newly indexed document.
        """
        if not self.enabled or not self.dag_id:
            return

        conf = {
            "event": "document_ingested",
            "filename": filename,
            "original_name": original_name or filename,
            "chunks_created": chunks_created,
            "file_size": file_size,
            "timestamp": int(time.time()),
        }

        try:
            asyncio.create_task(self._trigger_airflow_dag(self.dag_id, conf))
        except RuntimeError:
            # No running loop (e.g., during sync contexts) -> run in a new loop/thread
            try:
                asyncio.run(self._trigger_airflow_dag(self.dag_id, conf))
            except Exception as exc:
                logger.warning("Failed to dispatch Airflow trigger: %s", str(exc))


