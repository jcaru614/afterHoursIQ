import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="w-full bg-gradient-to-r from-[#0A0922] to-[#1D0F41] py-2 px-8 flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-4">
        <Image
          src="/images/logo.png"
          alt="AfterHoursIQ Logo"
          width={50}
          height={50}
          className="object-contain w-12 h-12"
        />
        <h1
          className="text-white text-2xl font-bold tracking-wide"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          AfterHoursIQ
        </h1>
      </div>
    </nav>
  );
}
