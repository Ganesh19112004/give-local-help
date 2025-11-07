import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, ArrowRight, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useDropzone } from "react-dropzone";

interface NGO {
  id: string;
  name: string;
  city: string;
  description: string;
}

interface DonationItem {
  item_name: string;
  quantity: number;
  condition: string;
  image_file?: File;
}

export default function CreateDonation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);

  // Form data
  const [selectedNgo, setSelectedNgo] = useState("");
  const [category, setCategory] = useState<"stationary" | "books" | "clothes" | "electronics" | "money" | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<DonationItem[]>([{ item_name: "", quantity: 1, condition: "good" }]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  useEffect(() => {
    checkAuth();
    fetchNGOs();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setPickupAddress(profileData.address || "");
    }
  };

  const fetchNGOs = async () => {
    const { data, error } = await supabase
      .from("ngos")
      .select("id, name, city, description")
      .eq("active", true);

    if (error) {
      toast({ title: "Error fetching NGOs", variant: "destructive" });
      return;
    }
    setNgos(data || []);
  };

  const handleImageUpload = (index: number, file: File) => {
    const newItems = [...items];
    newItems[index].image_file = file;
    setItems(newItems);
  };

  const removeImage = (index: number) => {
    const newItems = [...items];
    delete newItems[index].image_file;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { item_name: "", quantity: 1, condition: "good" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DonationItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const uploadItemImages = async (donationId: string) => {
    const uploadPromises = items.map(async (item, index) => {
      if (!item.image_file) return null;

      const fileExt = item.image_file.name.split('.').pop();
      const fileName = `${donationId}/${Date.now()}-${index}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("donation-items")
        .upload(fileName, item.image_file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      return fileName;
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!selectedNgo || !category) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (category !== "money" && items.some(item => !item.item_name)) {
      toast({ title: "Please provide names for all items", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Create donation
      const { data: donation, error: donationError } = await supabase
        .from("donations")
        .insert([{
          donor_id: user.id,
          ngo_id: selectedNgo,
          category,
          description,
          amount: category === "money" ? parseFloat(amount) : null,
          pickup_address: pickupAddress,
          preferred_pickup_date: preferredDate || null,
          status: "Requested" as const
        }])
        .select()
        .single();

      if (donationError) throw donationError;

      // Upload images and create donation items
      if (category !== "money") {
        const imagePaths = await uploadItemImages(donation.id);

        const itemsToInsert = items.map((item, index) => ({
          donation_id: donation.id,
          item_name: item.item_name,
          quantity: item.quantity,
          condition: item.condition,
          image_path: imagePaths[index]
        }));

        const { error: itemsError } = await supabase
          .from("donation_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({ title: "Donation created successfully!" });
      navigate("/donor/donations");
    } catch (error: any) {
      console.error("Error creating donation:", error);
      toast({ title: "Error creating donation", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadZone = ({ index }: { index: number }) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: { 'image/*': [] },
      maxFiles: 1,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleImageUpload(index, acceptedFiles[0]);
        }
      }
    });

    return (
      <div {...getRootProps()} className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
        <input {...getInputProps()} />
        {items[index].image_file ? (
          <div className="relative">
            <img 
              src={URL.createObjectURL(items[index].image_file!)} 
              alt="Preview" 
              className="max-h-32 mx-auto rounded"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(index);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drop image or click to upload</p>
          </div>
        )}
      </div>
    );
  };

  if (loading && step === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation role="donor" userName={user?.email} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create Donation</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {s}
                </div>
                {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <Card className="p-6">
            {/* Step 1: Select NGO */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Select NGO</h2>
                <div className="space-y-2">
                  <Label>Choose NGO *</Label>
                  <Select value={selectedNgo} onValueChange={setSelectedNgo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an NGO" />
                    </SelectTrigger>
                    <SelectContent>
                      {ngos.map((ngo) => (
                        <SelectItem key={ngo.id} value={ngo.id}>
                          {ngo.name} - {ngo.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedNgo && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {ngos.find(n => n.id === selectedNgo)?.description}
                    </p>
                  </div>
                )}
                <Button onClick={() => setStep(2)} disabled={!selectedNgo} className="w-full">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Category & Description */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Donation Details</h2>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stationary">Stationary</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="clothes">Clothes</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="money">Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your donation"
                    rows={3}
                  />
                </div>
                {category === "money" && (
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!category} className="flex-1">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Items Details */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                  {category === "money" ? "Confirm Amount" : "Item Details"}
                </h2>
                {category === "money" ? (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-lg font-semibold">Amount: ₹{amount}</p>
                  </div>
                ) : (
                  <>
                    {items.map((item, index) => (
                      <Card key={index} className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Item {index + 1}</h3>
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Item Name *</Label>
                            <Input
                              value={item.item_name}
                              onChange={(e) => updateItem(index, "item_name", e.target.value)}
                              placeholder="e.g., Textbooks"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                              min={1}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select 
                            value={item.condition} 
                            onValueChange={(val) => updateItem(index, "condition", val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Image</Label>
                          <ImageUploadZone index={index} />
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addItem} className="w-full">
                      + Add Another Item
                    </Button>
                  </>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Pickup Details & Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Pickup Details & Review</h2>
                {category !== "money" && (
                  <>
                    <div className="space-y-2">
                      <Label>Pickup Address *</Label>
                      <Textarea
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter full pickup address"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Pickup Date</Label>
                      <Input
                        type="datetime-local"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                  <h3 className="font-semibold">Review Your Donation</h3>
                  <p><strong>NGO:</strong> {ngos.find(n => n.id === selectedNgo)?.name}</p>
                  <p><strong>Category:</strong> {category}</p>
                  {category === "money" ? (
                    <p><strong>Amount:</strong> ₹{amount}</p>
                  ) : (
                    <p><strong>Items:</strong> {items.length} item(s)</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Donation
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
