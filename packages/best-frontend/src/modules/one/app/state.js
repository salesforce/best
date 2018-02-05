const INITIAL_STATE = {
    selectedPage: "home",
    pageType: "home",
    pageState: {},

    navItems: [{
        "label": "Home",
        "route": "/home",
        "entityApiName": "home",
        showMenu: false,
        "navAction": {
            type: "navigateHome",
            page: 'home'
        },
        "id": "home"
    }],


    lastCommits: {},
    projects: [],
    branches: {},
    commits: {}
};

export default INITIAL_STATE;
