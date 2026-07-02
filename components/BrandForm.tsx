"use client";

import { useState } from "react";
import { motion } from "motion/react";

export function BrandForm() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Connect to the generation API
    console.log({ companyName, industry, brandDescription });
    
    // Simulate API call for now
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Icon generation process started! (API integration pending)");
    }, 1500);
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit} 
      className="max-w-xl w-full mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100"
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <input
            id="industry"
            type="text"
            required
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            placeholder="e.g. Technology, Health & Wellness"
          />
        </div>

        <div>
          <label htmlFor="brandDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Brand Identity Description
          </label>
          <textarea
            id="brandDescription"
            required
            rows={4}
            value={brandDescription}
            onChange={(e) => setBrandDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none"
            placeholder="Describe your brand's personality, core values, and visual style..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Starting Process...</span>
            </span>
          ) : (
            "Kickstart Icon Generation"
          )}
        </button>
      </div>
    </motion.form>
  );
}
