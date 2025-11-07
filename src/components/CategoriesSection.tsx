import CategoryCard from "./CategoryCard";
import { 
  Shirt, 
  Book, 
  Stethoscope, 
  Home, 
  Banknote, 
  Package 
} from "lucide-react";

const CategoriesSection = () => {
  const categories = [
    {
      title: "Clothing",
      description: "Donate clothes, shoes, and accessories for people in need across different age groups.",
      icon: Shirt,
      itemCount: 150,
      urgency: "medium" as const
    },
    {
      title: "Education Supplies", 
      description: "Books, stationery, school bags, and learning materials for underprivileged children.",
      icon: Book,
      itemCount: 280,
      urgency: "high" as const
    },
    {
      title: "Healthcare & Hygiene",
      description: "Medicines, sanitary kits, first aid supplies, and personal hygiene products.",
      icon: Stethoscope,
      itemCount: 95,
      urgency: "high" as const
    },
    {
      title: "Shelter Support",
      description: "Blankets, mattresses, tents, and essential items for housing support.",
      icon: Home,
      itemCount: 67,
      urgency: "medium" as const
    },
    {
      title: "Financial Contributions",
      description: "Direct monetary donations to help NGOs fund their ongoing projects and operations.",
      icon: Banknote,
      itemCount: 45,
      urgency: "low" as const
    },
    {
      title: "Other Essentials",
      description: "Kitchen utensils, tools, electronics, and other miscellaneous items needed by communities.",
      icon: Package,
      itemCount: 123,
      urgency: "low" as const
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Donation Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from various categories to make your donation. Every item helps create positive impact in local communities.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              title={category.title}
              description={category.description}
              icon={category.icon}
              itemCount={category.itemCount}
              urgency={category.urgency}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;