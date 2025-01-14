export const MomentumChart = ({ width = "437px", height = "330px" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 437 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 219C0 207.954 8.95431 199 20 199H107C118.046 199 127 207.954 127 219V330H0V219Z"
        fill="#262626"
      />
      <path
        d="M310 258C310 246.954 318.954 238 330 238H417C428.046 238 437 246.954 437 258V330H310V258Z"
        fill="#141414"
      />
      <path
        d="M155 146C155 134.954 163.954 126 175 126H262C273.046 126 282 134.954 282 146V330H155V146Z"
        fill="url(#paint0_linear_0_1)"
      />
      <g filter="url(#filter0_i_0_1)">
        <circle cx="219" cy="55" r="55" fill="#F3F3F3" />
      </g>
      <g filter="url(#filter1_i_0_1)">
        <circle cx="219" cy="55" r="48" fill="#F3F3F3" />
      </g>
      <path
        d="M215.893 48.5536L198.513 64.0158C197.396 65.0607 198.135 66.933 199.665 66.933L210.535 66.9329C210.761 66.9329 210.978 66.8415 211.136 66.6794L237.169 40.0038C238.24 38.9724 240.025 39.7314 240.025 41.2182V65.2467C240.025 66.1779 239.27 66.9327 238.339 66.9327L219.789 66.9329C219.325 66.9329 218.949 66.5565 218.949 66.0922V60.6102V49.3225C218.949 47.8472 216.97 47.5456 215.893 48.5536Z"
        stroke="black"
        strokeWidth="2.57743"
        strokeLinecap="round"
      />
      <defs>
        <filter
          id="filter0_i_0_1"
          x="164"
          y="0"
          width="110"
          height="110"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.335824 0 0 0 0 0.335824 0 0 0 0 0.335824 0 0 0 0.68 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_1" />
        </filter>
        <filter
          id="filter1_i_0_1"
          x="171"
          y="7"
          width="96"
          height="96"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.335824 0 0 0 0 0.335824 0 0 0 0 0.335824 0 0 0 0.68 0"
          />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_0_1" />
        </filter>
        <linearGradient
          id="paint0_linear_0_1"
          x1="218.5"
          y1="126"
          x2="218.5"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8F8F8" />
          <stop offset="1" stopColor="#141414" />
        </linearGradient>
      </defs>
    </svg>
  );
};
