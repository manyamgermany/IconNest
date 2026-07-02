import { BrandForm } from "@/components/BrandForm";

export default function Page() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-3xl w-full mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Brand Icon Generator
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Provide your company details and brand identity to kickstart the AI-driven icon generation process.
        </p>
      </div>
      
      <BrandForm />
    </main>
  );
}
