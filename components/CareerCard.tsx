"use client";

import Image from "next/image";
import Link from "next/link";

interface CareerCardProps {
  title: string;
  image: string;
  description?: string;
  href: string;
}

export default function CareerCard({ title, image, description, href }: CareerCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="shadow-md rounded-xl overflow-hidden bg-white hover:shadow-xl transition">
        <div className="relative w-full h-48">
          <Image
            src={image}
            alt={title}
            width={400}
            height={260}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 text-center">
          <h3 className="font-semibold text-lg text-blue-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
