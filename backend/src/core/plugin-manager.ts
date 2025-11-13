import { Express, Router } from 'express';
import { logger } from './logger';

export interface Module {
  name: string;
  routes?: Router;
  dependencies?: string[];
  initialize?: () => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
}

export class PluginManager {
  private modules: Map<string, Module> = new Map();
  private initialized: Set<string> = new Set();
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Register a module with the plugin manager
   */
  register(module: Module): void {
    if (this.modules.has(module.name)) {
      logger.warn(`Module ${module.name} is already registered`);
      return;
    }

    logger.info(`Registering module: ${module.name}`);
    this.modules.set(module.name, module);
  }

  /**
   * Initialize all registered modules
   * Handles dependency order automatically
   */
  async initializeAll(): Promise<void> {
    logger.info('Initializing all modules...');

    const modulesToInit = Array.from(this.modules.values());

    // Sort by dependencies (simple topological sort)
    const sorted = this.topologicalSort(modulesToInit);

    for (const module of sorted) {
      await this.initializeModule(module);
    }

    logger.info(`Initialized ${this.initialized.size} modules`);
  }

  /**
   * Initialize a single module
   */
  private async initializeModule(module: Module): Promise<void> {
    if (this.initialized.has(module.name)) {
      return;
    }

    // Check dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(
            `Module ${module.name} depends on ${dep}, but ${dep} is not registered`
          );
        }
        if (!this.initialized.has(dep)) {
          const depModule = this.modules.get(dep)!;
          await this.initializeModule(depModule);
        }
      }
    }

    logger.info(`Initializing module: ${module.name}`);

    // Run module initialization
    if (module.initialize) {
      await module.initialize();
    }

    // Register routes
    if (module.routes) {
      this.app.use(`/api/${module.name}`, module.routes);
      logger.info(`Registered routes for module: ${module.name} at /api/${module.name}`);
    }

    this.initialized.add(module.name);
  }

  /**
   * Unregister and cleanup a module
   */
  async unregister(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    if (!module) {
      logger.warn(`Cannot unregister module ${moduleName}: not found`);
      return;
    }

    // Check if other modules depend on this one
    for (const [name, mod] of this.modules) {
      if (mod.dependencies?.includes(moduleName)) {
        throw new Error(
          `Cannot unregister module ${moduleName}: ${name} depends on it`
        );
      }
    }

    logger.info(`Unregistering module: ${moduleName}`);

    // Run cleanup
    if (module.cleanup) {
      await module.cleanup();
    }

    this.modules.delete(moduleName);
    this.initialized.delete(moduleName);
  }

  /**
   * Clean up all modules
   */
  async cleanupAll(): Promise<void> {
    logger.info('Cleaning up all modules...');

    const modules = Array.from(this.modules.values()).reverse();

    for (const module of modules) {
      if (module.cleanup) {
        try {
          await module.cleanup();
          logger.info(`Cleaned up module: ${module.name}`);
        } catch (error) {
          logger.error(`Error cleaning up module ${module.name}:`, error);
        }
      }
    }
  }

  /**
   * Get a registered module
   */
  getModule(name: string): Module | undefined {
    return this.modules.get(name);
  }

  /**
   * Check if a module is registered
   */
  hasModule(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Simple topological sort for module dependencies
   */
  private topologicalSort(modules: Module[]): Module[] {
    const sorted: Module[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (module: Module) => {
      if (visited.has(module.name)) {
        return;
      }

      if (visiting.has(module.name)) {
        throw new Error(`Circular dependency detected involving ${module.name}`);
      }

      visiting.add(module.name);

      if (module.dependencies) {
        for (const depName of module.dependencies) {
          const dep = modules.find(m => m.name === depName);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(module.name);
      visited.add(module.name);
      sorted.push(module);
    };

    for (const module of modules) {
      visit(module);
    }

    return sorted;
  }
}
