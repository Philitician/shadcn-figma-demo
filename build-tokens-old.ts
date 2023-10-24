import StyleDictionary from "style-dictionary";
import { registerTransforms } from "@tokens-studio/sd-transforms";

// Register the custom transforms
registerTransforms(StyleDictionary);

const styleDictionary = StyleDictionary.extend({
  source: ["tokens.json"],
  platforms: {
    css: {
      transformGroup: "tokens-studio",
      buildPath: "build/",
      files: [
        {
          destination: "variables.css",
          format: "css/variables",
        },
      ],
    },
    tailwind: {
      transformGroup: "tokens-studio",
      buildPath: "build/",
      files: [
        {
          destination: "tailwind.base.config.cjs",
          format: "javascript/module",
        },
      ],
    },
  },
});

styleDictionary.buildAllPlatforms();
