// import {
//   addRxPlugin,
//   createRxDatabase,
//   RxCollection,
//   RxDocument,
// } from "rxdb/plugins/core";
// import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
// import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
// import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
// import { replicateRxCollection } from "rxdb/plugins/replication";
// import { supabase, type DB } from "@/lib/supabase/supabase";
// import { SupabaseReplication } from "rxdb-supabase";
// import { SupabaseClient } from "@supabase/supabase-js";

// addRxPlugin(RxDBDevModePlugin);

// // Define RxDB types
// type ProductDoc = RxDocument<DB<"products">>;
// type ProductCollection = RxCollection<DB<"products">>;

// export const myDatabase = await createRxDatabase({
//   name: "mydatabase",
//   storage: wrappedValidateAjvStorage({
//     storage: getRxStorageDexie(),
//   }),
// });

// const todoSchema = {
//   version: 0,
//   primaryKey: "id",
//   type: "object",
//   properties: {
//     id: {
//       type: "string",
//       maxLength: 100, // <- the primary key must have maxLength
//     },
//     name: {
//       type: "string",
//     },
//     done: {
//       type: "boolean",
//     },
//     timestamp: {
//       type: "string",
//     },
//     _modified: {
//       type: "string",
//     },
//     _deleted: {
//       type: "boolean",
//     },
//   },
//   required: ["id", "name", "done", "timestamp"],
// };

// const collection = await myDatabase.addCollections({
//   // name of the collection
//   todos: {
//     // we use the JSON-schema standard
//     schema: todoSchema,
//   },
// });

// const replicationState = new SupabaseReplication({
//   SupabaseClient: supabase,
//   collection: collection.todos, // Ensure this is the correct collection
//   replicationIdentifier: "supabase-sync-products",
//   pull: {},
//   push: {},
//   live: true,
//   retryTime: 5000,
// });

// replicationState.error$.subscribe((err) => {
//   console.error("Replication error:", err);
// });
