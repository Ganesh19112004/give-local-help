import NGOCard from "./NGOCard";
import helpingHandsImage from "@/assets/ngo-helping-hands.jpg";
import care4healthImage from "@/assets/ngo-care4health.jpg";
import warmShelterImage from "@/assets/ngo-warm-shelter.jpg";

const FeaturedNGOs = () => {
  const featuredNGOs = [
    {
      name: "Helping Hands Foundation",
      location: "Mumbai, Maharashtra",
      focus: "Education",
      description: "Dedicated to providing quality education and learning resources to underprivileged children in urban and rural areas.",
      needs: [
        { item: "School notebooks", quantity: 50, emoji: "📒" },
        { item: "Pens & pencils", quantity: 100, emoji: "✏️" },
        { item: "School bags", quantity: 25, emoji: "🎒" },
        { item: "Geometry boxes", quantity: 30, emoji: "📐" }
      ],
      volunteers: 120,
      image: helpingHandsImage,
      verified: true
    },
    {
      name: "Care4Health Trust",
      location: "Delhi, NCR",
      focus: "Healthcare",
      description: "Focused on improving healthcare access and hygiene standards in underserved communities across India.",
      needs: [
        { item: "Sanitary kits", quantity: 75, emoji: "🧴" },
        { item: "First aid boxes", quantity: 10, emoji: "🩹" },
        { item: "Hand sanitizers", quantity: 50, emoji: "🧼" },
        { item: "Face masks", quantity: 200, emoji: "😷" }
      ],
      volunteers: 85,
      image: care4healthImage,
      verified: true
    },
    {
      name: "Warm Shelter NGO",
      location: "Bangalore, Karnataka",
      focus: "Shelter & Support",
      description: "Providing shelter support and essential items to help homeless individuals and families build better lives.",
      needs: [
        { item: "Blankets", quantity: 25, emoji: "🛏️" },
        { item: "Mattresses", quantity: 15, emoji: "🛏️" },
        { item: "Winter clothes", quantity: 40, emoji: "🧥" },
        { item: "Sleeping bags", quantity: 20, emoji: "🏕️" }
      ],
      volunteers: 95,
      image: warmShelterImage,
      verified: true
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Featured NGOs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover verified local NGOs making real impact in their communities. 
            See their current needs and contribute directly to causes you care about.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredNGOs.map((ngo, index) => (
            <NGOCard
              key={index}
              name={ngo.name}
              location={ngo.location}
              focus={ngo.focus}
              description={ngo.description}
              needs={ngo.needs}
              volunteers={ngo.volunteers}
              image={ngo.image}
              verified={ngo.verified}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedNGOs;