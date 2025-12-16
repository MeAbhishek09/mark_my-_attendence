import React from "react";
import {
  Camera,
  CheckCircle,
  Download,
  ArrowRight,
} from "lucide-react";

export default function HomeLanding({ onMarkClick, onViewClick }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 md:p-8">

      {/* ================= HERO SECTION ================= */}
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
              Smart Attendance System
            </h1>

            <p className="mt-4 text-gray-600 text-base md:text-lg">
              Mark attendance instantly using real-time facial recognition.
              Fast, accurate, and fully automated for classrooms.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={onMarkClick}
                className="flex items-center justify-center gap-2
                           bg-blue-600 hover:bg-blue-700
                           text-white px-6 py-3
                           rounded-lg font-semibold transition"
              >
                Mark Attendance <ArrowRight size={18} />
              </button>

              <button
                onClick={onViewClick}
                className="flex items-center justify-center
                           border border-blue-600 text-blue-600
                           px-6 py-3 rounded-lg
                           font-semibold hover:bg-blue-50 transition"
              >
                View Records
              </button>
            </div>
          </div>

          {/* RIGHT ICON */}
          <div className="flex justify-center">
            <div className="bg-blue-100 p-6 md:p-8 rounded-xl">
              <Camera size={96} className="text-blue-600 md:w-28 md:h-28" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div className="max-w-6xl mx-auto mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        <FeatureCard
          icon={<Camera size={28} />}
          title="Face Recognition"
          desc="Automatically detects and recognizes students using AI."
        />

        <FeatureCard
          icon={<CheckCircle size={28} />}
          title="Accurate & Secure"
          desc="Prevents proxy attendance with confidence scoring."
        />

        <FeatureCard
          icon={<Download size={28} />}
          title="Export Records"
          desc="Download attendance reports by day, week, month or year."
        />
      </div>

      {/* ================= HOW IT WORKS ================= */}
      <div className="max-w-6xl mx-auto mt-12 bg-white rounded-xl shadow p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          How It Works
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          <Step
            step="1"
            title="Create Session"
            desc="Select department, semester, subject and time."
          />
          <Step
            step="2"
            title="Mark Attendance"
            desc="Students show their face to the camera."
          />
          <Step
            step="3"
            title="Download Reports"
            desc="Export attendance records anytime."
          />
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <hr className="my-10 border-gray-200" />

      <div className="text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Smart Attendance System • Powered by AI
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 text-center
                    hover:shadow-lg hover:-translate-y-1
                    transition-all duration-300">
      <div className="flex justify-center text-blue-600 mb-3">
        {icon}
      </div>
      <h4 className="font-semibold text-lg">{title}</h4>
      <p className="text-gray-600 text-sm mt-2">{desc}</p>
    </div>
  );
}

function Step({ step, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 flex items-center justify-center
                      rounded-full bg-blue-600 text-white font-bold">
        {step}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-gray-600 text-sm">{desc}</p>
      </div>
    </div>
  );
}
