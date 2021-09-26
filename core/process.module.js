const parseEnv = () => {
  return process.argv.map((item) => {
    const argPair = Array.of(item.split('='));
    return Object.fromEntries(argPair);
  });
};

const getEnv = (envAttr) => {
  const containsEnv = parseEnv().find((item) => item[envAttr] !== undefined);
  if (!containsEnv) return false;
  return containsEnv[envAttr];
};

const hasEnv = (envAttr) => {
  const envVarList = parseEnv().map((item) => Object.keys(item)[0]);
  return envVarList.includes(envAttr);
};

module.exports = { getEnv, hasEnv };
