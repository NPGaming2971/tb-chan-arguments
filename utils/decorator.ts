/**
 * Nếu resolver yêu cầu 1 module bên ngoài, sử dụng decorator này để check module khi người dùng sử dụng method từ resolver này.
 * @param modules Những modules mà class này yêu cầu.
 * @returns
 */
export function RequireModules(cache: object, modules: Record<string, string>): ClassDecorator {
	return (target) => {
		return new Proxy(target, {
			get(target, key) {
				const val = Reflect.get(target, key);
				if (typeof val !== 'function') return val;

				return async function (...args: any[]) {
					for (const [key, id] of Object.entries(modules)) {
						try {
							let targetModule = Reflect.get(cache, key);
							if (!targetModule) targetModule = await import(id);

							// Caching
							Reflect.set(cache, key, targetModule);
						} catch (err) {
							throw err;
						}
					}

					return val.call(target, ...args);
				};
			}
		});
	};
}
