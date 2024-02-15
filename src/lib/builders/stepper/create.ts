import { disabledAttr, hiddenInputAttrs } from '$lib/internal/helpers/attr.js';
import { builder, createElHelpers } from '$lib/internal/helpers/builder.js';
import { addMeltEventListener } from '$lib/internal/helpers/event.js';
import { kbd } from '$lib/internal/helpers/keyboard.js';
import { omit } from '$lib/internal/helpers/object.js';
import { overridable } from '$lib/internal/helpers/overridable.js';
import { effect } from '$lib/internal/helpers/store/effect.js';
import { toWritableStores } from '$lib/internal/helpers/store/toWritableStores.js';
import { withGet } from '$lib/internal/helpers/withGet.js';
import { writable } from 'svelte/store';
import type { CreateStepperProps } from './types.js';

const defaults = {
	defaultValue: 0,
	min: undefined,
	max: undefined,
	step: 1,
	loop: false,
	disabled: false,
} satisfies CreateStepperProps;

const { name } = createElHelpers('stepper');

export function createStepper(props?: CreateStepperProps) {
	const withDefaults = { ...defaults, ...props } satisfies CreateStepperProps;

	const value = overridable(
		withDefaults.value ?? writable(withDefaults.defaultValue),
		withDefaults.onValueChange
	);

	const options = toWritableStores(omit(withDefaults, 'value', 'defaultValue', 'onValueChange'));
	const { min, max, step, loop, disabled } = options;

	/**
	 * The previous value of the stepper, or `null` if there is no previous value.
	 *
	 * If `loop` is `true`, the previous value will be `max` instead of `null`.
	 */
	const previous = withGet.derived(
		[value, min, max, step, loop],
		([$value, $min, $max, $step, $loop]) => {
			const $previous = $value - $step;
			if ($min === undefined || $previous >= $min) {
				return $previous;
			}
			if ($loop && $max !== undefined) {
				return $max;
			}
			return null;
		}
	);

	/**
	 * The next value of the stepper, or `null` if there is no next value.
	 *
	 * If `loop` is `true`, the next value will be `min` instead of `null`.
	 */
	const next = withGet.derived(
		[value, min, max, step, loop],
		([$value, $min, $max, $step, $loop]) => {
			const $next = $value + $step;
			if ($max === undefined || $next <= $max) {
				return $next;
			}
			if ($loop && $min !== undefined) {
				return $min;
			}
			return null;
		}
	);

	/**
	 * Increases the stepper's value by `step`.
	 */
	function increment() {
		const $next = next.get();
		if ($next !== null) {
			value.set($next);
		}
	}

	/**
	 * Decreases the stepper's value by `step`.
	 */
	function decrement() {
		const $previous = previous.get();
		if ($previous !== null) {
			value.set($previous);
		}
	}

	const stepper = builder(name(), {
		stores: [value, min, max, disabled],
		returned: ([$value, $min, $max, $disabled]) => {
			return {
				role: 'spinbutton',
				tabindex: 0,
				'aria-valuenow': $value,
				'aria-valuemin': $min,
				'aria-valuemax': $max,
				'aria-disabled': $disabled,
			} as const;
		},
		action: (node: HTMLElement) => {
			function handleKeyDown(event: KeyboardEvent) {
				if (disabled.get()) {
					return;
				}

				switch (event.key) {
					case kbd.ARROW_UP: {
						preventDefaultStopPropogation(event);
						increment();
						break;
					}
					case kbd.ARROW_DOWN: {
						preventDefaultStopPropogation(event);
						decrement();
						break;
					}
					case kbd.HOME: {
						const $min = min.get();
						if ($min === undefined) {
							break;
						}
						preventDefaultStopPropogation(event);
						value.set($min);
						break;
					}
					case kbd.END: {
						const $max = max.get();
						if ($max === undefined) {
							break;
						}
						preventDefaultStopPropogation(event);
						value.set($max);
						break;
					}
				}
			}

			const destroy = addMeltEventListener(node, 'keydown', handleKeyDown);
			return {
				destroy,
			};
		},
	});

	const incrementButton = builder(name('increment-button'), {
		stores: [disabled, next],
		returned: ([$disabled, $next]) => {
			return {
				type: 'button',
				tabindex: -1,
				disabled: disabledAttr($disabled || $next === null),
			} as const;
		},
		action: (node: HTMLElement) => {
			function handleClick(event: MouseEvent) {
				if (disabled.get()) {
					return;
				}
				preventDefaultStopPropogation(event);
				increment();
			}

			const destroy = addMeltEventListener(node, 'click', handleClick);
			return {
				destroy,
			};
		},
	});

	const decrementButton = builder(name('decrement-button'), {
		stores: [disabled, previous],
		returned: ([$disabled, $previous]) => {
			return {
				type: 'button',
				tabindex: -1,
				disabled: disabledAttr($disabled || $previous === null),
			} as const;
		},
		action: (node: HTMLElement) => {
			function handleClick(event: MouseEvent) {
				if (disabled.get()) {
					return;
				}
				preventDefaultStopPropogation(event);
				decrement();
			}

			const destroy = addMeltEventListener(node, 'click', handleClick);
			return {
				destroy,
			};
		},
	});

	const hiddenInput = builder(name('hidden-input'), {
		stores: value,
		returned: ($value) => {
			return {
				...hiddenInputAttrs,
				value: $value,
			} as const;
		},
	});

	effect([value, min, max, step], ([$value, $min, $max, $step]) => {
		// Ensure $min <= $value <= $max
		if ($min !== undefined && $value < $min) {
			value.set($min);
		} else if ($max !== undefined && $value > $max) {
			// Find the largest n such that $min + n * step <= $max.
			// In other words, the largest n such that n <= ($max - $min) / step.
			//
			// If there is no minimum, just set the value to the maximum.
			if ($min === undefined) {
				value.set($max);
				return;
			}
			const n = Math.floor(($max - $min) / $step);
			value.set($min + n * $step);
		}
	});

	return {
		elements: {
			stepper,
			incrementButton,
			decrementButton,
			hiddenInput,
		},
		states: {
			value,
			previous,
			next,
		},
		options,
		helpers: {
			increment,
			decrement,
		},
	};
}

function preventDefaultStopPropogation(event: Event) {
	event.preventDefault();
	event.stopPropagation();
}
