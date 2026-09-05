export const state = {
  session: null,
  me: null,
  route: {root:'work', sub:'dashboard'},
  data: {
    profiles: [], members: [], locations: [], memberLocations: [], schedules: [], scheduleExceptions: [],
    attendance: [], breaks: [], breakTypes: [], taskCategories: [], tasks: [], taskTimes: [], interruptions: [],
    purchases: [], leavePeriods: [], leaveRequests: [], leaveTypes: [], holidays: [], notifications: [],
    incidents: [], library: [], questions: [], products: [], variants: [], providers: [], providerPrices: [], competitors: []
  },
  loading: false,
  refreshTimer: null,
  tickTimer: null,
  modalResolver: null,
};

export function resetState(){
  state.session=null; state.me=null; state.loading=false;
  for(const key of Object.keys(state.data)) state.data[key]=[];
  clearInterval(state.refreshTimer); clearInterval(state.tickTimer);
  state.refreshTimer=null; state.tickTimer=null;
}