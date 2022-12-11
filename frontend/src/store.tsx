import { ColorScheme } from "@mantine/core";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { SurrealistTab } from "./typings";
import { renameWindow } from "./util/helpers";

const mainSlice = createSlice({
	name: 'main',
	initialState: {	
		colorScheme: 'light' as ColorScheme,
		knownTabs: [] as SurrealistTab[],
		activeTab: null as string|null
	},
	reducers: {
		setColorScheme(state, action: PayloadAction<ColorScheme>) {
			state.colorScheme = action.payload;
		},

		addTab(state, action: PayloadAction<SurrealistTab>) {
			state.knownTabs.push(action.payload);
		},

		removeTab(state, action: PayloadAction<string>) {
			state.knownTabs = state.knownTabs.filter(tab => tab.id !== action.payload);

			if (state.activeTab === action.payload) {
				const firstTab = state.knownTabs[0];

				state.activeTab = firstTab.id;

				renameWindow(firstTab.name);
			}
		},

		updateTab(state, action: PayloadAction<Partial<SurrealistTab>>) {
			const tabIndex = state.knownTabs.findIndex(tab => tab.id === action.payload.id);

			if (tabIndex >= 0) {
				const tab = state.knownTabs[tabIndex];

				state.knownTabs[tabIndex] = { ...tab, ...action.payload };

				if (tab.id === state.activeTab) {
					renameWindow(action.payload.name);
				}
			}
		},

		setActiveTab(state, action: PayloadAction<string>) {
			state.activeTab = action.payload;

			const theTab = state.knownTabs.find(tab => tab.id === action.payload);

			renameWindow(theTab?.name);
		}
	}
});


export const actions = mainSlice.actions;
export const store = configureStore({
	reducer: mainSlice.reducer
});

export type StoreState = ReturnType<typeof store.getState>
export type StoreActions = typeof store.dispatch

export const useStoreValue: TypedUseSelectorHook<StoreState> = useSelector