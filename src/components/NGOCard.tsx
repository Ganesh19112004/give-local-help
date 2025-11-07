import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock, Heart } from "lucide-react";

interface NGONeed {
  item: string;
  quantity: number;
  emoji: string;
}

interface NGOCardProps {
  name: string;
  location: string;
  focus: string;
  description: string;
  needs: NGONeed[];
  volunteers: number;
  image: string;
  verified: boolean;
}

const NGOCard = ({ name, location, focus, description, needs, volunteers, image, verified }: NGOCardProps) => {
  return (
    <Card className="overflow-hidden transition-bounce hover:scale-105 hover:shadow-warm">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={image} 
          alt={`${name} organization`}
          className="w-full h-full object-cover transition-smooth hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          {verified && (
            <Badge className="bg-primary text-primary-foreground">
              Verified NGO
            </Badge>
          )}
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-bold text-lg">{name}</h3>
          <div className="flex items-center text-sm opacity-90">
            <MapPin className="h-4 w-4 mr-1" />
            {location}
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary">{focus}</Badge>
          <div className="flex items-center text-muted-foreground text-sm">
            <Users className="h-4 w-4 mr-1" />
            {volunteers} volunteers
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Current Needs</h4>
            <div className="flex items-center text-muted-foreground text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Updated today
            </div>
          </div>
          
          <div className="space-y-2">
            {needs.slice(0, 3).map((need, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{need.emoji}</span>
                  <span className="text-sm">{need.item}</span>
                </div>
                <span className="text-sm font-medium">{need.quantity}</span>
              </div>
            ))}
          </div>
          
          <Button className="w-full gradient-hero text-primary-foreground shadow-soft transition-bounce hover:scale-105">
            <Heart className="mr-2 h-4 w-4" />
            View & Donate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NGOCard;