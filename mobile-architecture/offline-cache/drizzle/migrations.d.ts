// O `migrations.js` é gerado pelo drizzle-kit em JavaScript. Este arquivo dá
// tipo ao import sem precisar de `allowJs` no projeto inteiro.
declare const migrations: {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
