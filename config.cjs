/** @type {import('style-dictionary').Config} */
module.exports = {
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
};
