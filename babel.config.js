module.exports = function (api) {
    api.cache(true);
    return {
        // zustand (build ESM) utilise import.meta, non supporté par le bundle web classique
        presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    };
};
