import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { 
  BookOpen, 
  Heart, 
  Briefcase, 
  Music, 
  Users, 
  Target,
  Lock,
  Sparkles,
  CheckCircle,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const rooms = [
    { icon: <BookOpen className="w-6 h-6" />, name: "Study Room", desc: "Focus on learning & academic goals" },
    { icon: <Heart className="w-6 h-6" />, name: "Health & Wellness", desc: "Track fitness, nutrition & mental wellbeing" },
    { icon: <Briefcase className="w-6 h-6" />, name: "Career Hub", desc: "Professional projects & career growth" },
    { icon: <Music className="w-6 h-6" />, name: "Creative Studio", desc: "Passions, hobbies & artistic pursuits" },
    { icon: <Users className="w-6 h-6" />, name: "Social Lounge", desc: "Connections & relationships" },
    { icon: <Target className="w-6 h-6" />, name: "Goals Gallery", desc: "Dreams, targets & achievements" },
  ];

  const features = [
    { icon: <Lock className="w-4 h-4" />, text: "Private & secure by design" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Customizable rooms" },
    { icon: <Zap className="w-4 h-4" />, text: "Cross-device sync" },
    { icon: <CheckCircle className="w-4 h-4" />, text: "Progress tracking" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#7DD3FC]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#0F172A] rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-[#94A3B8]/5 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Main CTA Section - Centered */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F172A]/50 border border-[#94A3B8]/10 mb-6">
            <Sparkles className="w-4 h-4 text-[#7DD3FC]" />
            <span className="text-sm text-[#94A3B8]">Your personal space awaits</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-[#F1F5F9] tracking-tight mb-6">
            Your personal
            <span className="block text-[#7DD3FC] mt-2">digital house</span>
          </h1>
          
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed mb-10">
            A calm, organized space for every aspect of your life. 
            Move between rooms designed for focus, growth, and wellbeing.
          </p>

          {/* Main Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link href="/login" className="flex-1">
              <Button 
                variant="primary" 
                className="w-full group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Enter Your Home 
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">🏠</span>
                </span>
                <div className="text-[#7DD3FC] hover:underline" />
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button 
                variant="secondary"
                className="w-full group relative overflow-hidden border-[#94A3B8]/20 hover:border-[#7DD3FC]/30"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Build My Home 
                  <span className="ml-2 transition-all duration-300 group-hover:rotate-90">🧱</span>
                </span>
                <div className="absolute inset-0 bg-[#7DD3FC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="rounded-3xl bg-[#0F172A]/90 border border-[#94A3B8]/10 p-8 mb-8 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-[#F1F5F9] text-center mb-8">
            Designed for your entire life
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex flex-col items-center p-4 rounded-xl bg-[#0F172A]/50 border border-[#94A3B8]/5 hover:border-[#7DD3FC]/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#7DD3FC]/10 flex items-center justify-center text-[#7DD3FC] mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <p className="text-sm text-center text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-[#94A3B8] text-sm">
            Everything stays organized in dedicated spaces, just like rooms in a home
          </p>
        </div>

        {/* Rooms Preview */}
        <div className="rounded-3xl bg-[#0F172A]/90 border border-[#94A3B8]/10 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-[#F1F5F9] text-center mb-8">
            Explore Your Rooms
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {rooms.map((room, index) => (
              <div 
                key={index}
                className="group p-5 rounded-xl bg-[#0F172A]/50 border border-[#94A3B8]/5 hover:border-[#7DD3FC]/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[#7DD3FC]/10 flex items-center justify-center text-[#7DD3FC] group-hover:bg-[#7DD3FC]/20 transition-colors">
                    {room.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#F1F5F9] group-hover:text-[#7DD3FC] transition-colors">
                      {room.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#94A3B8] group-hover:text-[#94A3B8]/80 transition-colors">
                  {room.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-[#94A3B8] text-sm mb-2">
              Each room helps you focus on one area of your life
            </p>
            <p className="text-[#94A3B8] text-xs">
              Create custom rooms for any purpose
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-[#94A3B8] mb-6">
            Ready to organize your life, one room at a time?
          </p>
          
          {/* Same buttons repeated at bottom */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link href="/login" className="flex-1">
              <Button 
                variant="primary" 
                className="w-full group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Enter Your Home 
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">🏠</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7DD3FC] to-[#0EA5E9] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button 
                variant="secondary"
                className="w-full group relative overflow-hidden border-[#94A3B8]/20 hover:border-[#7DD3FC]/30"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Build My Home 
                  <span className="ml-2 transition-all duration-300 group-hover:rotate-90">🧱</span>
                </span>
                <div className="absolute inset-0 bg-[#7DD3FC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-[#94A3B8]">
            Your digital home is just a click away
          </p>
        </div>
      </div>
    </main>
  );
}