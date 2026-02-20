import svgPaths from "./svg-tq2ogdtzyp";

export default function BgAnimation() {
  return (
    <div className="relative size-full" data-name="BG - Animation">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1080 1920">
        <g clipPath="url(#clip0_84_94)" id="BG - Animation">
          <rect fill="white" height="1920" width="1080" />
          <rect fill="var(--fill-0, #040F0F)" height="1920" id="BG" width="1080" />
          <path d={svgPaths.p18b49d80} fill="var(--fill-0, #00E083)" id="Vector 6" />
          <path d={svgPaths.p26f35f00} fill="var(--fill-0, #00E083)" id="Vector 7" />
          <g filter="url(#filter0_d_84_94)" id="Vector 8">
            <path d={svgPaths.p38254d00} fill="var(--fill-0, #00E083)" />
            <path d={svgPaths.p38254d00} stroke="var(--stroke-0, black)" />
          </g>
          <rect data-figma-bg-blur-radius="400" fill="var(--fill-0, #040F0F)" fillOpacity="0.1" height="1920" id="BG blur" width="1080" />
        </g>
        <defs>
          <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="870.778" id="filter0_d_84_94" width="714.651" x="430.398" y="-96.9476">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_84_94" />
            <feBlend in="SourceGraphic" in2="effect1_dropShadow_84_94" mode="normal" result="shape" />
          </filter>
          <clipPath id="bgblur_1_84_94_clip_path" transform="translate(400 400)">
            <rect height="1920" width="1080" />
          </clipPath>
          <clipPath id="clip0_84_94">
            <rect fill="white" height="1920" width="1080" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}