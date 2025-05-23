import { Module, forwardRef } from '@nestjs/common';
// Assuming ZapierIntegrationModule will be created.
// If ZapierIntegrationModule is in the same library or a circular dependency might arise later:
import { ZapierIntegrationModule } from './zapier/zapier.module';

@Module({
  imports: [
    // Use forwardRef if ZapierIntegrationModule itself imports from AutomationToolsIntegrationModule (unlikely for this structure)
    // or if there are complex module dependency chains during startup.
    // For now, a direct import should be fine assuming ZapierIntegrationModule is self-contained or its dependencies are clear.
    ZapierIntegrationModule,
    // Other automation tool modules can be imported here
  ],
  exports: [
    // Export services from the imported modules if they need to be used by other top-level modules
    // e.g., if ZapierService needs to be injected elsewhere directly (though usually consumed via ZapierController)
    ZapierIntegrationModule, // Exporting the whole module makes its exported providers available
  ],
})
export class AutomationToolsIntegrationModule {}