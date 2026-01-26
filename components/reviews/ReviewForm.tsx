"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface ReviewFormProps {
  employerId: string;
  onReviewSubmitted?: () => void;
  className?: string;
}

/**
 * ReviewForm Component
 * Allows employees to submit anonymous or verified reviews for employers
 */
export default function ReviewForm({
  employerId,
  onReviewSubmitted,
  className = "",
}: ReviewFormProps) {
  const session = useSession();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Optional: Use logged-in user's ID for verified reviews
  const reviewerId = session?.data?.user?.id || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    if (reviewText.length > 2000) {
      setError("Review must be less than 2000 characters");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: reviewerId || "", // Required field - use empty string if anonymous
          employer_id: employerId,
          rating,
          comment: reviewText.trim(),
          anonymous: !reviewerId, // Anonymous if no user logged in
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Success
      setSuccess(true);
      setRating(0);
      setReviewText("");
      setHoveredRating(0);

      // Callback to refresh review list
      if (onReviewSubmitted) {
        setTimeout(() => {
          onReviewSubmitted();
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Write a Review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {rating === 1
                ? "Poor"
                : rating === 2
                ? "Fair"
                : rating === 3
                ? "Good"
                : rating === 4
                ? "Very Good"
                : "Excellent"}
            </p>
          )}
        </div>

        {/* Review Text Input */}
        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-comment"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your experience working for this employer..."
            required
            minLength={10}
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {reviewText.length}/2000 characters
          </p>
        </div>

        {/* Anonymous Notice */}
        {!reviewerId && (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <span className="font-semibold">Note:</span> Your review will be
            submitted anonymously. No personal information will be displayed.
          </p>
        )}

        {/* Verified Badge Notice */}
        {reviewerId && (
          <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            <span className="font-semibold">✓ Verified Review:</span> Your
            review will be marked as verified since you're logged in.
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            ✓ Review submitted successfully! Thank you for your feedback.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
