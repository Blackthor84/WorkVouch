import CareerCard from "@/components/CareerCard";

const careers = [
  { 
    id: "security",
    title: "Security", 
    image: "/careers/security.jpg",
    description: "Verified work history for security professionals"
  },
  { 
    id: "healthcare",
    title: "Healthcare", 
    image: "/careers/healthcare.jpg",
    description: "Trusted profiles for healthcare workers"
  },
  { 
    id: "warehouse",
    title: "Warehouse", 
    image: "/careers/warehouse.jpg",
    description: "Verified employment for warehouse & logistics"
  },
  { 
    id: "hospitality",
    title: "Hospitality", 
    image: "/careers/hospitality.jpg",
    description: "Build credibility in hospitality careers"
  },
  { 
    id: "law",
    title: "Law Enforcement", 
    image: "/careers/law.jpg",
    description: "Verified work history for law enforcement"
  },
  { 
    id: "retail",
    title: "Retail", 
    image: "/careers/retail.jpg",
    description: "Trusted profiles for retail professionals"
  }
];

export default function CareersPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-12">
          Explore Careers With WorkVouch
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {careers.map((career) => (
            <CareerCard
              key={career.id}
              title={career.title}
              image={career.image}
              description={career.description}
              href={`/careers/${career.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
