import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


class EmailNotifier:
    def __init__(self) -> None:
        self.host = os.getenv("SMTP_HOST")
        self.port = int(os.getenv("SMTP_PORT", "0") or 0)
        self.user = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASS")
        self.sender = os.getenv("SMTP_FROM", self.user or "no-reply@buddy.local")

    def _configured(self) -> bool:
        return bool(self.host and self.port and self.sender)

    def send_email(self, to_email: str, subject: str, body: str) -> None:
        if not self._configured():
            logger.info("[Email] %s -> %s | %s", subject, to_email, body.replace("\n", " ")[:200])
            return
        try:
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = self.sender
            msg["To"] = to_email
            msg.set_content(body)

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.user and self.password:
                    server.starttls()
                    server.login(self.user, self.password)
                server.send_message(msg)
            logger.info("Email sent to %s: %s", to_email, subject)
        except Exception as exc:
            logger.warning("Email send failed to %s: %s", to_email, str(exc))


