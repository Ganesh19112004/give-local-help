import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Clock, Users } from "lucide-react";

const NearbyNGOs = () => {
  const nearbyNGOs = [
    {
      name: "Children's Hope Foundation",
      distance: "2.3 km away",
      urgentNeed: "School uniforms needed urgently",
      volunteers: 45,
      lastUpdate: "2 hours ago"
    },
    {
      name: "Community Health Center",
      distance: "3.7 km away", 
      urgentNeed: "Medical supplies for health camps",
      volunteers: 62,
      lastUpdate: "4 hours ago"
    },
    {
      name: "Shelter for All",
      distance: "5.1 km away",
      urgentNeed: "Winter blankets for upcoming season",
      volunteers: 38,
      lastUpdate: "1 hour ago"
    },
    {
      name: "Green Future Initiative",
      distance: "6.8 km away",
      urgentNeed: "Books and educational materials",
      volunteers: 71,
      lastUpdate: "3 hours ago"
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            NGOs Near You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find local organizations in your area that need immediate support. 
            The closer you donate, the bigger the local impact.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 mb-8">
            {nearbyNGOs.map((ngo, index) => (
              <Card key={index} className="transition-smooth hover:shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{ngo.name}</h3>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {ngo.distance}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {ngo.urgentNeed}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {ngo.volunteers} volunteers
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Updated {ngo.lastUpdate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Navigation className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                      <Button className="gradient-hero text-primary-foreground">
                        View Needs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button size="lg" variant="outline" className="transition-smooth hover:bg-accent">
              <MapPin className="mr-2 h-5 w-5" />
              View All Nearby NGOs
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NearbyNGOs;