import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  itemCount: number;
  urgency: "high" | "medium" | "low";
}

const CategoryCard = ({ title, description, icon: Icon, itemCount, urgency }: CategoryCardProps) => {
  const urgencyColors = {
    high: "border-destructive bg-destructive/5",
    medium: "border-secondary bg-secondary-light",
    low: "border-accent bg-accent"
  };

  const urgencyBadges = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-secondary text-secondary-foreground", 
    low: "bg-accent-foreground text-accent"
  };

  return (
    <Card className={`cursor-pointer transition-bounce hover:scale-105 hover:shadow-warm ${urgencyColors[urgency]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyBadges[urgency]}`}>
            {itemCount} needed
          </span>
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Urgency</span>
            <span className="text-sm font-medium capitalize">{urgency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;