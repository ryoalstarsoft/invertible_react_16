import React, { Component } from 'react';
import Breadcrumbs from 'react-breadcrumbs';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import FlashMessagesList from './flash/FlashMessagesList';
import '../assets/stylesheets/style.scss';
import '../assets/stylesheets/components/App.scss';
import { Route, Switch } from 'react-router';
import Performance from './Performance';
import Explorer from './Explorer';
import ChartDetail from './ChartDetail';
import Knowledge from './Knowledge';
import LoginPage from './login/LoginPage';
import HomePage from './HomePage';
import Funnel from './Funnel';

class App extends Component {
    render() {
        return (
            <div className="app">
                <Header />
                <FlashMessagesList />
                <div className="app-body">
                    <main className="main">
                        <Switch>
                            <Route exact path="/" component={HomePage} />
                            <Route path="login" component={LoginPage} />
                            <Route path="/performance" component={Performance} />
                            <Route path="/explorer" component={Explorer} />
                            <Route path="/chart-detail" component={ChartDetail} />
                            <Route path="/knowledge" component={Knowledge} />
                            <Route path="/funnel" component={Funnel} />
                        </Switch>
                    </main>
                </div>
                <Footer />
            </div>
        );
    }
}

export default App;
