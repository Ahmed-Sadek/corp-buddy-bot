import { useState } from "react";
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  lastUpdated: Date;
}

interface Document {
  id: string;
  name: string;
  category: string;
  uploadDate: Date;
  size: string;
}

const Staff = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: "1",
      question: "What is the travel policy?",
      answer: "Our travel policy requires manager approval for all business trips. Employees can book flights and hotels through our corporate travel portal. Receipts must be submitted within 30 days for reimbursement.",
      category: "Travel",
      lastUpdated: new Date(),
    },
    {
      id: "2",
      question: "How do remote work arrangements work?",
      answer: "Remote work is available up to 3 days per week with manager approval. Employees must maintain core hours of 10 AM - 3 PM in their local timezone.",
      category: "Work Policy",
      lastUpdated: new Date(),
    },
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Employee Handbook 2024",
      category: "General",
      uploadDate: new Date(),
      size: "2.4 MB",
    },
    {
      id: "2",
      name: "IT Security Guidelines",
      category: "IT",
      uploadDate: new Date(),
      size: "1.8 MB",
    },
  ]);

  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "" });
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const userEmail = localStorage.getItem("userEmail") || "staff@company.com";

  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer || !newFaq.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const faq: FAQItem = {
      id: Date.now().toString(),
      question: newFaq.question,
      answer: newFaq.answer,
      category: newFaq.category,
      lastUpdated: new Date(),
    };

    setFaqs(prev => [...prev, faq]);
    setNewFaq({ question: "", answer: "", category: "" });
    
    toast({
      title: "FAQ Added",
      description: "New FAQ has been added to the knowledge base.",
    });
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id));
    toast({
      title: "FAQ Deleted",
      description: "FAQ has been removed from the knowledge base.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const doc: Document = {
        id: Date.now().toString(),
        name: file.name,
        category: "General",
        uploadDate: new Date(),
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
      };

      setDocuments(prev => [...prev, doc]);
      
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been added to the knowledge base.`,
      });
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
                            <Badge variant="secondary">{faq.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Updated {faq.lastUpdated.toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setEditingFaq(faq.id)}>
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
                      Supports PDF, DOC, DOCX files up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx"
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
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Category: {doc.category}</span>
                            <span>Size: {doc.size}</span>
                            <span>Uploaded: {doc.uploadDate.toLocaleDateString()}</span>
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
