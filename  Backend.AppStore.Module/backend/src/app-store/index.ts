export * from './app-store.module';

// Export any other public services, interfaces, or enums that are meant to be consumed by other modules
// For example, if there are DTOs or interfaces that other modules might need to interact with the AppStoreModule:
// export * from './application/dtos'; // Assuming a barrel file in dtos
// export * from './domain/interfaces'; // Assuming a barrel file for repository interfaces, if they are meant to be public
// export * from './common/enums'; // Assuming a barrel file for enums

// However, based on the specific instruction "re-exporting the AppStoreModule class",
// and the general principle of modular monoliths (modules interact via application services or events,
// not usually exposing raw repositories or domain services directly),
// exporting only the AppStoreModule is the primary goal here.
// Other exports would depend on how strictly encapsulated this module is intended to be
// and what its public API contract with other modules is.
// For now, sticking to the minimal instruction: