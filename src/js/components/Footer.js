import React, { Component } from 'react'
import { connect } from 'react-redux'
import { metadataSelector } from '../selectors'
import config from '../config' // eslint-disable-line

class Footer extends Component {

  render () {
    const { metadata } = this.props
    if (!metadata.get('showFooter')) {
      return <div className='footer'>&nbsp;</div>
    }
    const originalTitle = metadata.getIn(['original', 'title'])
    const originalUrl = metadata.getIn(['original', 'url'])
    let original
    if (originalTitle !== undefined && originalUrl !== undefined) {
      original = (
        <span className='footer-row'>
          <i className='fa fa-sitemap'></i>&nbsp;
          Forked from <a href={originalUrl}>{originalTitle}</a>.
        </span>
      )
    }
    return (
      <div className='footer'>
        <hr className='footer-sep top-sep' />
        {original}
        <span className='footer-row'>
          <i className='fa fa-flask' />&nbsp;
          Made with <a href={config.kayeroHomepage}>Kayero</a>.
        </span>
      </div>
    )
  }

}

Footer.propTypes = {
  metadata: React.PropTypes.object
}

export default connect(metadataSelector)(Footer)
