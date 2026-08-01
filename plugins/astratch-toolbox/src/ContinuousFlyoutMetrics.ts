/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import type { ContinuousFlyout } from './ContinuousFlyout';

/** Adds additional padding to the bottom of the flyout if needed. */
export class ContinuousFlyoutMetrics extends Blockly.FlyoutMetricsManager {
    /** 从可滚动视口中扣除固定搜索栏占用的高度。 */
    override getViewMetrics(getWorkspaceCoordinates?: boolean) {
        const viewMetrics = super.getViewMetrics(getWorkspaceCoordinates);
        const searchBarHeight = (this.flyout_ as ContinuousFlyout).getSearchBarHeight(
            getWorkspaceCoordinates,
        );

        viewMetrics.height = Math.max(0, viewMetrics.height - searchBarHeight);
        return viewMetrics;
    }

    /**
     * Returns the metrics for the scroll area of the continuous flyout's
     * workspace. Adds additional padding to the bottom of the flyout if needed in
     * order to make it possible  to scroll to the top of the last category.
     *
     * @param getWorkspaceCoordinates True to get the scroll metrics in
     *     workspace coordinates, false to get them in pixel coordinates.
     * @param cachedViewMetrics The view metrics if they have been previously
     *     computed.
     * @param cachedContentMetrics The content metrics if they have been
     *     previously computed.
     * @returns The metrics for the scroll container.
     */
    override getScrollMetrics(
        getWorkspaceCoordinates?: boolean,
        cachedViewMetrics?: Blockly.MetricsManager.ContainerRegion,
        cachedContentMetrics?: Blockly.MetricsManager.ContainerRegion,
    ) {
        const scrollMetrics = super.getScrollMetrics(
            getWorkspaceCoordinates,
            cachedViewMetrics,
            cachedContentMetrics,
        );
        const contentMetrics =
            cachedContentMetrics || this.getContentMetrics(getWorkspaceCoordinates);
        const viewMetrics = cachedViewMetrics || this.getViewMetrics(getWorkspaceCoordinates);

        if (scrollMetrics) {
            scrollMetrics.height += (this.flyout_ as ContinuousFlyout).calculateBottomPadding(
                contentMetrics,
                viewMetrics,
                getWorkspaceCoordinates,
            );
        }
        return scrollMetrics;
    }
}
