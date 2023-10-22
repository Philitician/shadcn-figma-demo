// build.js
import StyleDictionary from "style-dictionary";

const myStyleDictionary = StyleDictionary.extend({
  source: ["tokens.json"],
  transform: {
    myTransform: {
      type: "name",
      transformer: (token) => {
        console.log(token);
        return `myprefix-${token.name}`;
      },
    },
  },
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "./",
      files: [
        {
          destination: "globals.css",
          format: "css/variables",
        },
      ],
    },
  },
});

myStyleDictionary.buildAllPlatforms();
