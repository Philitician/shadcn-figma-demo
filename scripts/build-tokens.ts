import StyleDictionary, {
  Config,
  Platform,
  TransformedToken,
} from "style-dictionary";

import Color from "color";

const getReferenceValue = (
  tokenValue: TransformedToken,
  options: Platform<Record<string, any>>
) => {
  const referencePath = tokenValue.slice(1, -1);
  // @ts-ignore
  return StyleDictionary.transformer.resolve(referencePath, options);
};

const isReference = (tokenValue: string) =>
  tokenValue.startsWith("{") && tokenValue.endsWith("}");

StyleDictionary.registerTransform({
  name: "color/hsl",
  type: "value",
  matcher: (token) => token.type === "color",
  transformer: ({ name, value }, options) => {
    const tokenValue = isReference(value)
      ? getReferenceValue(value, options)
      : value;

    const hsl = Color(tokenValue).hsl().round(1);

    const hslString = hsl.string();
    const hslStringFormatted = hslString
      .replace(/[hsla()]/g, "")
      .replaceAll(",", "");

    const [h, ...hslRest] = hslStringFormatted.split(" ");

    // h part of the string is inprecise and must be rounded to 1 decimal place
    const hRounded = Math.round(Number(h) * 10) / 10;
    return `${hRounded} ${hslRest.join(" ")}`;
  },
});

StyleDictionary.registerTransform({
  name: "alias/resolve",
  type: "value",
  transformer: ({ value }, options) =>
    isReference(value) ? getReferenceValue(value, options) : value,
});

const isDefaultTokenItem = (path: string[]) =>
  path[path.length - 1].toLowerCase() === "default";

const colorExtensionsMap = {
  "colors-bg": "backgroundColor",
  "colors-text": "textColor",
  "colors-border": "borderColor",
} as const;

type ColorExtensionMapKey = keyof typeof colorExtensionsMap;

const createCollectionTypeKey = (
  path: string[]
): ColorExtensionMapKey | string => {
  const [category, type] = path;
  return `${category}-${type}`;
};

type TailwindCorePluginConfig = {
  name: (typeof colorExtensionsMap)[ColorExtensionMapKey];
  config: Record<string, any>;
};

function recursiveInsert(
  obj: Record<string, any>,
  path: string[],
  value: string
) {
  const [first, ...rest] = path;

  if (rest.length === 0) {
    if (
      !Object.isFrozen(obj) &&
      Object.getOwnPropertyDescriptor(obj, first)?.writable !== false
    ) {
      obj[first] = value;
    }
    return;
  }

  if (!obj[first] || typeof obj[first] !== "object") {
    if (
      !Object.isFrozen(obj) &&
      Object.getOwnPropertyDescriptor(obj, first)?.writable !== false
    ) {
      obj[first] = {};
    } else {
      // Handle error case where property is read-only
      return;
    }
  }

  recursiveInsert(obj[first], rest, value);
}

function createTailwindConfig(
  tokens: TransformedToken[]
): Record<(typeof colorExtensionsMap)[ColorExtensionMapKey] | "colors", any> {
  const result: Record<string, any> = {
    colors: {},
    backgroundColor: {},
    textColor: {},
    borderColor: {},
  };

  tokens.forEach((token) => {
    const collectionTypeKey = createCollectionTypeKey(token.path);
    const tailwindKey =
      colorExtensionsMap[collectionTypeKey as ColorExtensionMapKey] || "colors";

    const cssVarName = `--${token.name}`;
    const cssVarValue = `hsl(var(${cssVarName}))`;

    let pathForInsertion: string[];

    // Remove category and type (like 'bg' or 'text') from path for insertion if they are 'bg', 'text', or 'border'.
    // Otherwise, keep the type.
    if (["bg", "text", "border"].includes(token.path[1])) {
      const [_1, _2, ...rest] = token.path;
      pathForInsertion = rest;
    } else {
      const [_, ...rest] = token.path;
      pathForInsertion = rest;
    }

    // Transform 'default' to 'DEFAULT'
    pathForInsertion = pathForInsertion.map((item) =>
      item === "default" ? "DEFAULT" : item
    );

    recursiveInsert(result[tailwindKey], pathForInsertion, cssVarValue);
  });

  return result;
}

StyleDictionary.registerFormat({
  name: "tailwind/js",
  formatter: function (dictionary) {
    const colorsConfig = createTailwindConfig(
      dictionary.dictionary.allProperties
    );

    return `
export const colors = ${JSON.stringify(colorsConfig.colors, null, 2)};
export const backgroundColor = ${JSON.stringify(
      colorsConfig.backgroundColor,
      null,
      2
    )};

export const textColor = ${JSON.stringify(colorsConfig.textColor, null, 2)};

export const borderColor = ${JSON.stringify(colorsConfig.borderColor, null, 2)};
    `;
  },
});

const THEMES = ["light", "dark"];
async function run() {
  const cssVariableConfigs = THEMES.map((theme) => {
    return {
      source: [`./tokens/brand/${theme}.json`, "./tokens/core/colors.json"],
      platforms: {
        css: {
          transforms: ["attribute/cti", "name/cti/kebab", "color/hsl"],
          buildPath: "./styles/css/",
          files: [
            {
              destination: `${theme}.css`,
              format: "css/variables",
            },
          ],
        },
      },
    } satisfies Config;
  });

  const tailwindConfig: Config = {
    source: ["tokens/brand/light.json", "tokens/core/colors.json"],
    platforms: {
      // custom transform used for tailwind
      js: {
        transforms: ["attribute/cti", "name/cti/kebab", "alias/resolve"],
        buildPath: "./styles/tailwind/",
        files: [
          {
            destination: `tailwind.core.plugins.config.ts`,
            format: "tailwind/js",
          },
        ],
      },
    },
  };

  [...cssVariableConfigs, tailwindConfig].forEach((config) => {
    const sd = StyleDictionary.extend(config);
    sd.cleanAllPlatforms(); // optionally, cleanup files first..
    sd.buildAllPlatforms();
  });
}

run();
