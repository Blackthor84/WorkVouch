// components/CareerModal.tsx
import { FC } from "react";

interface CareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  career: CareerData | null;
}

export interface CareerData {
  name: string;
  image: string;
  employerBenefits: string[];
  employeeBenefits: string[];
}

const CareerModal: FC<CareerModalProps> = ({ isOpen, onClose, career }) => {
  if (!isOpen || !career) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{career.name}</h2>
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Why Employers Choose WorkVouch</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {career.employerBenefits.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Why Employees Choose WorkVouch</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {career.employeeBenefits.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CareerModal;
