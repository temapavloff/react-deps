import { createContext, useContext, useMemo } from 'react';
import { DIContainer } from '@wessberg/di';

const DependenciesContext = createContext<DIContainer>(new DIContainer());

export const DependenciesProvider = DependenciesContext.Provider;

const useDependenciesContext = () => useContext(DependenciesContext);

export const useDep = <T>(getter?: (container: DIContainer) => T) => {
    const container = useDependenciesContext();
    return useMemo(() => {
        if (!getter) {
            throw new TypeError(
                'Oops! Dependency detter is not defined. '
                + 'Probably, you have forgotten to configure custom compiler. '
                + 'Please check out documentation for details: '
                + 'https://github.com/temapavloff/react-deps'
            );
        }
        return getter(container);
    }, [container, getter])
}
