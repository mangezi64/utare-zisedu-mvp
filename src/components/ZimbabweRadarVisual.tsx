import { BookOpen, Briefcase, Building2 } from "lucide-react";
import ZimbabweMapGraphic from "@/components/ZimbabweMapGraphic";

/**
 * Shared Zimbabwe ("ZW") radial pathways illustration used in the overview hero
 * and the sign-in split screen.
 */
export default function ZimbabweRadarVisual({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={className ? `hero-visual ${className}` : "hero-visual"}
      aria-label="Illustration of Zimbabwe connected to global opportunities"
    >
      <div className="visual-grid" />
      <div className="map-ring ring-1" />
      <div className="map-ring ring-2" />
      <div className="map-center">
        <ZimbabweMapGraphic className="w-[144px] h-[126px] drop-shadow-[0_8px_20px_rgba(5,150,105,0.55)]" />
        <div className="map-center-overlay">
          <span>ZW</span>
          <small>ZIMBABWE</small>
        </div>
      </div>
      <span className="map-point point-1">
        <BookOpen className="h-4 w-4" />
      </span>
      <span className="map-point point-2">
        <Briefcase className="h-4 w-4" />
      </span>
      <span className="map-point point-3">
        <Building2 className="h-4 w-4" />
      </span>
      <span className="map-line line-1" />
      <span className="map-line line-2" />
      <span className="map-line line-3" />
      <div className="map-label">
        Connected pathways
        <br />
        <b>Local roots · Global reach</b>
      </div>
    </div>
  );
}
