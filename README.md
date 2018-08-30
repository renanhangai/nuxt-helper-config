# nuxt-helper-config

Basic Usage
----------------------

```ts
const helper = require( "@renanhangai/nuxt-helper-config" );

const generator = helper.create({
  /*
    Project root dir. (Where package.json is located)
  */
  rootDir: String,
  /*
    Where files will be put
  */
  buildDir: String,
  /*
    Object with default options for every config generated
  */
  defaults: Object,
});

/*
  srcDir is the name of the nuxt source directory
 */
generator( srcDir, {
  /*
    Alias for modules being imported.
  */
  alias: Object,
  /*
    Array of css to be included on the build
  */
  css: Array,
  plugins: Array,
  modules: Array,
  middleware: Array,
  /*
    Map with constants to be defined during compilation phase
  */
  define: Map< String, any >,
  provide: Map< String, String|Array<String> >,
});
```
