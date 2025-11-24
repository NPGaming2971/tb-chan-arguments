type LibCacheObject = {
	__finished?: boolean;
	[key: string]: any;
};

/**
 * Nếu resolver yêu cầu 1 module bên ngoài, sử dụng decorator này để check module khi người dùng sử dụng method từ resolver này.
 * @param modules Những modules mà class này yêu cầu.
 * @returns
 */
export function RequireModules<T extends LibCacheObject>(cache: T, modules: Record<string, string>): ClassDecorator {
	return (target) => {
		return new Proxy(target, {
			get(target, key) {
				const val = Reflect.get(target, key);

				// Nếu đã cache xong rồi thì sử dụng;
				if (cache.__finished && Reflect.has(target, key)) {
					return Reflect.get(cache, key);
				}

				// Nếu không phải là function thì ngừng ko xử lý
				if (typeof val !== 'function') return val;

				return async function (...args: any[]) {
					if (!cache.__finished) {
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
						cache.__finished = true;
					}

					return val.call(target, ...args);
				};
			},

			set(target, p, newValue, receiver) {
				if (!cache.__finished) {
					return Reflect.set(target, p, newValue, receiver);
				}

				const cacheKeyExisted = Reflect.has(cache, p);
				if (cacheKeyExisted) throw new Error('variable name conflicts with cache key');

				return Reflect.set(target, p, newValue, receiver);
			}
		});
	};
}
