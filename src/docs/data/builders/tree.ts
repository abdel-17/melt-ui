import { DESCRIPTIONS, KBD, PROPS } from '$docs/constants';
import type { KeyboardSchema } from '$docs/types';
import { builderSchema, elementSchema } from '$docs/utils';
import { treeEvents } from '$lib/builders/tree/events';
import type { BuilderData } from '.';

const BUILDER_NAME = 'tree-view';

const builder = builderSchema(BUILDER_NAME, {
	title: 'createTreeViewBuilder',
	description: DESCRIPTIONS.BUILDER('tree-view'),
	props: [
		PROPS.FORCE_VISIBLE,
		{
			name: 'multiple',
			description: 'Pass `true` to enable multi select.',
			type: 'boolean',
			default: 'false',
		},
	],
	elements: [
		{
			name: 'tree',
			description: 'The builder store used to create the tree.',
			link: '#tree',
		},
		{
			name: 'item',
			description: 'The builder store used to create a tree item.',
			link: '#item',
		},
		{
			name: 'group',
			description: 'The builder store used to create a tree group.',
		},
	],
	states: [
		{
			name: 'expanded',
			description: 'The list of IDs of items, who have a group that is expanded.',
			type: 'Writable<string[]>',
		},
		{
			name: 'selected',
			description: 'The list of IDs of selected items.',
			type: 'Writable<string[]>',
		},
		{
			name: 'firstSelected',
			description: 'The ID of the first selected item, or `null` if none are selected.',
			type: 'Readable<string | null>',
		},
	],
	helpers: [
		{
			name: 'isExpanded',
			description:
				'A derived store that returns a function that returns whether or not the item is expanded.',
			type: 'Readable<(itemId: string) => boolean>',
		},
		{
			name: 'isSelected',
			description:
				'A derived store that returns a function that returns whether or not the item is selected.',
			type: 'Readable<(itemId: string) => boolean>',
		},
	],
});

const tree = elementSchema('tree', {
	title: 'tree',
	description: 'The tree <ul> element.',
});

const item = elementSchema('item', {
	title: 'item',
	description: 'The list tree item.',
	props: [
		{
			name: 'id',
			description: 'The unique ID of the item.',
			type: 'string',
			required: true,
		},
		{
			name: 'hasChildren',
			description: 'Pass `true` if the item contains other items as children.',
			type: 'boolean',
		},
	],
	events: treeEvents['item'],
});

const group = elementSchema('group', {
	title: 'group',
	description: 'The list group item.',
	props: [
		{
			name: 'id',
			description: 'The unique ID of the group. Must match the ID of the item it belongs to.',
			type: 'string',
			required: true,
		},
	],
});

const keyboard: KeyboardSchema = [
	{
		key: KBD.ENTER,
		behavior: 'Selects the node, or toggles selection in multi-select mode.',
	},
	{
		key: KBD.SPACE,
		behavior: 'Selects the node, or toggles selection in multi-select mode.',
	},
	{
		key: KBD.ARROW_DOWN,
		behavior:
			'Moves focus to the next node that is focusable without opening or closing a node. If focus is on the last node, does nothing.',
	},
	{
		key: KBD.ARROW_UP,
		behavior:
			'Moves focus to the previous node that is focusable without opening or closing a node. If focus is on the first node, does nothing.',
	},
	{
		key: KBD.ARROW_RIGHT,
		behavior:
			'When focus is on a closed node, opens the node; focus does not move. When focus is on a open node, moves focus to the first child node. When focus is on an end node, does nothing.',
	},
	{
		key: KBD.ARROW_LEFT,
		behavior:
			'When focus is on an open node, closes the node. When focus is on a child node that is also either an end node or a closed node, moves focus to its parent node. When focus is on a root node that is also either an end node or a closed node, does nothing.',
	},
	{
		key: KBD.HOME,
		behavior: 'Moves focus to first node without opening or closing a node.',
	},
	{
		key: KBD.END,
		behavior:
			'Moves focus to the last node that can be focused without expanding any nodes that are closed.',
	},
	{
		key: KBD.LETTER,
		behavior:
			'Focus moves to the next node with a name that starts with the typed character. Search wraps to first node if a matching name is not found among the nodes that follow the focused node. Search ignores nodes that are descendants of closed nodes.',
	},
];

const schemas = [builder, tree, item, group];

const features: BuilderData['features'] = [
	'Full keyboard functionality',
	'Select individual items',
];

export const treeData: BuilderData = {
	schemas,
	features,
	keyboard,
};
