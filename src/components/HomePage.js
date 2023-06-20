import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addFlashMessage } from '../actions/flashMessages';
import Performance from './Performance';
import '../assets/stylesheets/components/HomePage.scss';

class HomePage extends React.Component {
    render() {
        return (
            <div className="home-container">
                <Performance />
            </div>
        );
    }
}

HomePage.propTypes = {
    isAuthenticated: PropTypes.bool.isRequired,
    addFlashMessage: PropTypes.func.isRequired
}

HomePage.contextTypes = {
    router: PropTypes.object.isRequired
}

function mapStateToProps(state) {
    return {
        isAuthenticated: state.auth.isAuthenticated,
    }
}

export default connect(mapStateToProps, { addFlashMessage })(HomePage);