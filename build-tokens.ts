import StyleDictionaryModule from "style-dictionary";
import { makeSdTailwindConfig } from "sd-tailwindcss-transformer";

const sdConfig = makeSdTailwindConfig({
  type: "all",
  formatType: "cjs",
  isVariables: true,
  source: ["./tokens/core/**/*.json", "./tokens/brands/**/*.json"],
  transforms: ["attribute/cti", "name/cti/kebab"],
  buildPath: `./`,
  tailwind: {
    content: [],
  },
});

sdConfig.platforms["css"] = {
  transformGroup: "css",
  buildPath: "./styles/",
  files: [
    {
      destination: "tailwind.css",
      format: "css/variables",
    },
  ],
};

const StyleDictionary = StyleDictionaryModule.extend(sdConfig);
StyleDictionary.buildAllPlatforms();
