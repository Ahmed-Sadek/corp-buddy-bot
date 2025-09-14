import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Users, LogOut, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FAQItem { id: number; question: string; answer: string; category?: string }

type BackendDocument = {
  filename: string;
  file_size: number;
  upload_date: number; // epoch seconds
  file_type: string;
};

const Staff = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";
  const [documents, setDocuments] = useState<BackendDocument[]>([]);

  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "" });
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userEmail = localStorage.getItem("userEmail") || "staff@company.com";

  const loadFaqs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/faqs/`);
      if (!res.ok) throw new Error(`List FAQs failed: ${res.status}`);
      const data = await res.json();
      setFaqs(data);
    } catch (err: any) {
      toast({ title: "Failed to load FAQs", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/documents/list`);
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      toast({ title: "Failed to load documents", description: err?.message || String(err), variant: "destructive" });
    }
  };

  useEffect(() => {
    void loadFaqs();
    void loadDocuments();
  }, []);

  const handleAddFaq = async () => {
    if (!newFaq.question || !newFaq.answer) {
      toast({
        title: "Missing Information",
        description: "Please provide question and answer.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/faqs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaq),
      });
      if (!res.ok) throw new Error(`Create FAQ failed: ${res.status}`);
      await loadFaqs();
      setNewFaq({ question: "", answer: "", category: "" });
      toast({ title: "FAQ Added", description: "New FAQ has been added and indexed." });
    } catch (err: any) {
      toast({ title: "Create FAQ failed", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const handleDeleteFaq = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete FAQ failed: ${res.status}`);
      await loadFaqs();
      toast({ title: "FAQ Deleted", description: "FAQ has been removed." });
    } catch (err: any) {
      toast({ title: "Delete FAQ failed", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${API_BASE}/api/documents/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const data = await res.json();
        toast({ title: "Document processed", description: `${file.name} indexed (${data.chunks_created} chunks)` });
        await loadDocuments();
      } catch (err: any) {
        toast({ title: "Upload failed", description: err?.message || String(err), variant: "destructive" });
      } finally {
        // reset input value so same file can be reselected if needed
        event.currentTarget.value = "";
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-xl">
              <Users className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Staff Portal</h1>
              <p className="text-sm text-muted-foreground">Knowledge Base Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userEmail}</p>
              <Badge variant="outline" className="text-xs border-accent">HR/IT Staff</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Knowledge Base Management</h2>
          <p className="text-muted-foreground">Manage FAQs and documents for the Buddy chatbot</p>
        </div>

        <Tabs defaultValue="faqs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faqs">FAQs Management</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            {/* Add New FAQ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New FAQ
                </CardTitle>
                <CardDescription>
                  Create new frequently asked questions for employees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Input
                      id="question"
                      placeholder="e.g., What is the dress code policy?"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., HR, IT, Travel"
                      value={newFaq.category}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea
                    id="answer"
                    placeholder="Provide a comprehensive answer..."
                    rows={4}
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddFaq} className="btn-primary bg-primary hover:bg-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </CardContent>
            </Card>

            {/* Existing FAQs */}
            <Card>
              <CardHeader>
                <CardTitle>Existing FAQs ({faqs.length})</CardTitle>
                <CardDescription>Manage your current knowledge base entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {faq.category && <Badge variant="secondary">{faq.category}</Badge>}
                          </div>
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setEditingFaq(String(faq.id))}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Upload Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload policy documents, handbooks, and guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload documents to knowledge base</p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOC, DOCX, TXT, MD files up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="mt-4 pointer-events-none">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Document Library ({documents.length})</CardTitle>
                <CardDescription>Manage uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.filename} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{doc.filename}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Type: {doc.file_type}</span>
                            <span>Size: {(doc.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                            <span>Uploaded: {new Date(doc.upload_date * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Staff;
