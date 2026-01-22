"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface WarehouseOnboardingProps {
  userId: string;
  onComplete: () => void;
}

export function WarehouseOnboarding({
  userId,
  onComplete,
}: WarehouseOnboardingProps) {
  const [warehouseType, setWarehouseType] = useState("");
  const [equipmentOperated, setEquipmentOperated] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const warehouseTypes = [
    "Fulfillment Center",
    "Distribution Center",
    "Cross-Dock Facility",
    "Cold Storage",
    "Manufacturing Warehouse",
    "Mixed / Not Sure",
  ];

  const equipmentOptions = [
    "Forklift (certified)",
    "Forklift (not certified)",
    "Pallet Jack (manual)",
    "Electric Pallet Jack",
    "Reach Truck",
    "Order Picker",
    "None",
  ];

  const responsibilityOptions = [
    "Picking",
    "Packing",
    "Shipping",
    "Receiving",
    "Inventory",
    "Labeling",
    "Loading",
    "Unloading",
    "Quality Check",
    "RF Scanner",
    "Safety Checks",
  ];

  const certificationOptions = [
    "Forklift Certification",
    "OSHA 10",
    "OSHA 30",
    "First Aid / CPR",
    "None",
  ];

  const toggleArrayItem = (
    array: string[],
    item: string,
    setter: (arr: string[]) => void,
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/profile/warehouse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warehouseType,
          equipmentOperated,
          responsibilities,
          certifications,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save warehouse data");
      }

      onComplete();
    } catch (error: any) {
      console.error("Error saving warehouse data:", error);
      alert(
        error.message || "Failed to save warehouse data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-6">
          Tell us about your warehouse experience
        </h2>
      </div>

      {/* Warehouse Type */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-4">
          What type of warehouse did you work in? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {warehouseTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setWarehouseType(type)}
              className={`p-3 rounded-xl border text-left transition-all ${
                warehouseType === type
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200 hover:border-primary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      {/* Equipment Operated */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Which equipment have you operated? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {equipmentOptions.map((equipment) => (
            <button
              key={equipment}
              type="button"
              onClick={() =>
                toggleArrayItem(
                  equipmentOperated,
                  equipment,
                  setEquipmentOperated,
                )
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                equipmentOperated.includes(equipment)
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200 hover:border-primary"
              }`}
            >
              {equipment}
            </button>
          ))}
        </div>
      </Card>

      {/* Responsibilities */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Common responsibilities you handled (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {responsibilityOptions.map((responsibility) => (
            <button
              key={responsibility}
              type="button"
              onClick={() =>
                toggleArrayItem(
                  responsibilities,
                  responsibility,
                  setResponsibilities,
                )
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                responsibilities.includes(responsibility)
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200 hover:border-primary"
              }`}
            >
              {responsibility}
            </button>
          ))}
        </div>
      </Card>

      {/* Certifications */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Did you hold any certifications? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certificationOptions.map((cert) => (
            <button
              key={cert}
              type="button"
              onClick={() =>
                toggleArrayItem(certifications, cert, setCertifications)
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                certifications.includes(cert)
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400"
                  : "bg-white dark:bg-[#111827] border-gray-300 dark:border-[#374151] text-grey-dark dark:text-gray-200 hover:border-primary"
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading || !warehouseType}
          className="flex-1"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onComplete}
          className="flex-1"
        >
          Skip for Now
        </Button>
      </div>
    </form>
  );
}
