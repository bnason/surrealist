import {
	FeatureFlagProvider,
	featureFlagsHookFactory,
} from '@theopensource-company/feature-flags/react';
import { ReactNode, useEffect } from 'react';
import { useConfigStore } from '~/stores/config';
import { featureFlags } from '~/util/feature-flags';

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
	const fromConfig = useConfigStore((s) => s.featureFlags);
	const setFeatureFlag = useConfigStore((s) => s.setFeatureFlag);
	
	useEffect(() => {
		featureFlags.subscribe(setFeatureFlag);
		return () => {
			featureFlags.unsubscribe(setFeatureFlag);
		};
	}, [featureFlags, setFeatureFlag]);

	return (
		<FeatureFlagProvider
			featureFlags={featureFlags}
			hydratedOverrides={(flag) => fromConfig[flag]}
		>
			{children}
		</FeatureFlagProvider>
	);
}

export const useFeatureFlags = featureFlagsHookFactory(featureFlags);