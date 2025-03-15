import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function WebRTCLogo({ className }: LogoProps) {
  return (
    <Image
      src="/github.svg"
      alt="GitHub Logo"
      width={256}
      height={256}
      className={className}
    />
  );
}
