import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  DashboardState,
  DashboardContextType,
  WidgetConfigUnion,
  WidgetPosition,
  WidgetSize,
  DashboardConfig,
} from "../types/dashboard";
// Use the real dashboard service
import dashboardService from "../services/dashboardService";

// Initial dashboard state
const initialState: DashboardState = {
  dashboards: [
    {
      id: "default",
      name: "Default Dashboard",
      widgets: [],
      columns: 4,
      isDefault: true,
    },
  ],
  activeDashboard: "default",
  isEditing: false,
};

// Dashboard reducer
type DashboardAction =
  | { type: "ADD_WIDGET"; payload: WidgetConfigUnion }
  | { type: "REMOVE_WIDGET"; payload: string }
  | { type: "UPDATE_WIDGET"; payload: WidgetConfigUnion }
  | { type: "MOVE_WIDGET"; payload: { id: string; position: WidgetPosition } }
  | { type: "RESIZE_WIDGET"; payload: { id: string; size: WidgetSize } }
  | { type: "CREATE_DASHBOARD"; payload: { id: string; name: string } }
  | { type: "SWITCH_DASHBOARD"; payload: string }
  | { type: "REMOVE_DASHBOARD"; payload: string }
  | { type: "TOGGLE_EDIT_MODE" }
  | { type: "SET_DASHBOARDS"; payload: DashboardConfig[] };

const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case "ADD_WIDGET": {
      const activeDashboard = state.dashboards.find(
        (d) => d.id === state.activeDashboard
      );
      if (!activeDashboard) return state;

      const updatedDashboards = state.dashboards.map((dashboard) => {
        if (dashboard.id === state.activeDashboard) {
          return {
            ...dashboard,
            widgets: [...(dashboard.widgets || []), action.payload],
          };
        }
        return dashboard;
      });

      return {
        ...state,
        dashboards: updatedDashboards,
      };
    }

    case "REMOVE_WIDGET": {
      const updatedDashboards = state.dashboards.map((dashboard) => {
        if (dashboard.id === state.activeDashboard) {
          return {
            ...dashboard,
            widgets: (dashboard.widgets || []).filter(
              (widget) => widget.id !== action.payload
            ),
          };
        }
        return dashboard;
      });

      return {
        ...state,
        dashboards: updatedDashboards,
      };
    }

    case "UPDATE_WIDGET": {
      const updatedDashboards = state.dashboards.map((dashboard) => {
        if (dashboard.id === state.activeDashboard) {
          return {
            ...dashboard,
            widgets: (dashboard.widgets || []).map((widget) =>
              widget.id === action.payload.id ? action.payload : widget
            ),
          };
        }
        return dashboard;
      });

      return {
        ...state,
        dashboards: updatedDashboards,
      };
    }

    case "MOVE_WIDGET": {
      const { id, position } = action.payload;
      const updatedDashboards = state.dashboards.map((dashboard) => {
        if (dashboard.id === state.activeDashboard) {
          return {
            ...dashboard,
            widgets: (dashboard.widgets || []).map((widget) =>
              widget.id === id ? { ...widget, position } : widget
            ),
          };
        }
        return dashboard;
      });

      return {
        ...state,
        dashboards: updatedDashboards,
      };
    }

    case "RESIZE_WIDGET": {
      const { id, size } = action.payload;
      const updatedDashboards = state.dashboards.map((dashboard) => {
        if (dashboard.id === state.activeDashboard) {
          return {
            ...dashboard,
            widgets: (dashboard.widgets || []).map((widget) =>
              widget.id === id ? { ...widget, size } : widget
            ),
          };
        }
        return dashboard;
      });

      return {
        ...state,
        dashboards: updatedDashboards,
      };
    }

    case "CREATE_DASHBOARD": {
      const { id, name } = action.payload;
      return {
        ...state,
        dashboards: [
          ...state.dashboards,
          {
            id,
            name,
            widgets: [],
            columns: 4,
          },
        ],
        activeDashboard: id,
      };
    }

    case "SWITCH_DASHBOARD": {
      return {
        ...state,
        activeDashboard: action.payload,
      };
    }

    case "REMOVE_DASHBOARD": {
      // Don't remove the last dashboard
      if (state.dashboards.length <= 1) return state;

      // Don't remove the default dashboard
      const dashboardToRemove = state.dashboards.find(
        (d) => d.id === action.payload
      );
      if (dashboardToRemove?.isDefault) return state;

      const updatedDashboards = state.dashboards.filter(
        (dashboard) => dashboard.id !== action.payload
      );

      // If removing the active dashboard, switch to the first available one
      const newActiveDashboard =
        state.activeDashboard === action.payload
          ? updatedDashboards[0].id
          : state.activeDashboard;

      return {
        ...state,
        dashboards: updatedDashboards,
        activeDashboard: newActiveDashboard,
      };
    }

    case "TOGGLE_EDIT_MODE": {
      return {
        ...state,
        isEditing: !state.isEditing,
      };
    }

    case "SET_DASHBOARDS": {
      return {
        ...state,
        dashboards: action.payload,
        activeDashboard:
          action.payload.length > 0
            ? action.payload[0].id
            : state.activeDashboard,
      };
    }

    default:
      return state;
  }
};

// Create the dashboard context
const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Dashboard provider props
interface DashboardProviderProps {
  children: ReactNode;
}

// Dashboard provider component
export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Load dashboards from API or create default on mount
  useEffect(() => {
    const loadDashboards = async () => {
      try {
        // Try to load from API first
        const dashboards = await dashboardService.getDashboards();
        if (dashboards && Array.isArray(dashboards) && dashboards.length > 0) {
          dispatch({ type: "SET_DASHBOARDS", payload: dashboards });
          return;
        } else {
          // If no dashboards returned from API, use the default state
          await dashboardService.saveDashboards(initialState.dashboards);
        }
      } catch (error) {
      }
    };

    loadDashboards();
  }, []);

  // We don't need to save to localStorage anymore as we're using the API
  // The saveDashboard function will handle persistence

  // Dashboard context value
  const value: DashboardContextType = {
    state,
    addWidget: (widget: WidgetConfigUnion) => {
      dispatch({ type: "ADD_WIDGET", payload: widget });
    },
    removeWidget: (id: string) => {
      dispatch({ type: "REMOVE_WIDGET", payload: id });
    },
    updateWidget: (widget: WidgetConfigUnion) => {
      dispatch({ type: "UPDATE_WIDGET", payload: widget });
    },
    moveWidget: (id: string, position: WidgetPosition) => {
      dispatch({ type: "MOVE_WIDGET", payload: { id, position } });
    },
    resizeWidget: (id: string, size: WidgetSize) => {
      dispatch({ type: "RESIZE_WIDGET", payload: { id, size } });
    },
    createDashboard: (name: string) => {
      const id = uuidv4();
      dispatch({ type: "CREATE_DASHBOARD", payload: { id, name } });
    },
    switchDashboard: (id: string) => {
      dispatch({ type: "SWITCH_DASHBOARD", payload: id });
    },
    removeDashboard: (id: string) => {
      dispatch({ type: "REMOVE_DASHBOARD", payload: id });
    },
    toggleEditMode: () => {
      dispatch({ type: "TOGGLE_EDIT_MODE" });
    },
    saveDashboard: async () => {
      try {
        await dashboardService.saveDashboards(state.dashboards);
        return Promise.resolve();
      } catch (error) {
        // Still save to local storage as fallback
        localStorage.setItem("dashboards", JSON.stringify(state.dashboards));
        return Promise.resolve();
      }
    },
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use the dashboard context
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
