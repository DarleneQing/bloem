import Image from "next/image";
import { Mail, Instagram, Linkedin } from "lucide-react";

interface MemberCardProps {
  name: string;
  role: string;
  bio?: string;
  imageSrc: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  email?: string;
}

export function MemberCard({ name, role, bio, imageSrc, linkedinUrl, instagramUrl, email }: MemberCardProps) {
  return (
    <div className="w-full max-w-xs sm:max-w-sm aspect-[4/5] md:aspect-square bg-white rounded-[32px] p-[3px] relative shadow-[0_70px_30px_-50px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out hover:rounded-tl-[55px] group mx-auto">
      {/* Mail Button - Always visible */}
      <div className="absolute right-8 top-6 z-0 transition-colors duration-300">
        {email && (
          <a href={`mailto:${email}`} className="text-brand-lavender hover:text-brand-purple transition-colors">
            <Mail size={24} strokeWidth={2.5} />
          </a>
        )}
      </div>

      {/* Profile Picture - Shrinks and moves on hover */}
      <div className="absolute top-[3px] left-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-[29px] z-10 overflow-hidden transition-all duration-500 ease-in-out delay-200 bg-gray-100 group-hover:w-[150px] group-hover:h-[150px] group-hover:top-[10px] group-hover:left-[10px] group-hover:rounded-full group-hover:z-30 group-hover:border-[7px] group-hover:border-brand-lavender group-hover:shadow-md group-hover:delay-0">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover transition-all duration-500 ease-in-out group-hover:scale-110"
        />
      </div>

      {/* Bottom Card - Slides up on hover */}
      <div className="absolute bottom-[3px] left-[3px] right-[3px] top-[calc(100%-60px)] bg-brand-lavender rounded-[29px] z-20 overflow-hidden transition-all duration-500 cubic-bezier(0.645,0.045,0.355,1) shadow-[rgba(96,75,74,0.1882352941)_0px_5px_5px_0px_inset] group-hover:top-[80px] group-hover:rounded-[80px_29px_29px_29px] group-hover:delay-200">
        {/* Content */}
        <div className="absolute bottom-0 left-6 right-6 top-0 flex flex-col justify-end pb-20">
          <h3 className="text-2xl font-bold text-white leading-tight">{name}</h3>
          {bio && (
            <p className="text-white/80 mt-4 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300">
              {bio}
            </p>
          )}
        </div>

        {/* Bottom Actions - Always visible */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between transition-opacity duration-300">
          <div className="flex gap-3">
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white hover:scale-110 transition-all">
                <Linkedin size={18} />
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white hover:scale-110 transition-all">
                <Instagram size={18} />
              </a>
            )}
          </div>
          <span className="text-white/90 text-s font-bold uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>
    </div>
  );
}

