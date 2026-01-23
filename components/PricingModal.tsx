"use client";

import { FC, useState } from "react";

interface ModalProps {
  tier: string;
  price: string;
  benefits: string[];
}

export const PricingModal: FC<ModalProps> = ({ tier, price, benefits }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full bg-white text-black font-semibold py-2 px-4 rounded hover:bg-gray-100 transition"
      >
        Select Plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-lg relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 font-bold text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2">{tier}</h2>
            <p className="text-lg font-semibold mb-4">{price}</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              {benefits.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
            <button
              onClick={() => alert(`Redirect to payment for ${tier}`)}
              className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}
    </>
  );
};
